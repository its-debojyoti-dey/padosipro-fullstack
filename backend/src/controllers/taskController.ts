import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const selectTasksSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1, 'Please select at least one task to continue'),
});

export async function getCatalog(req: AuthenticatedRequest, res: Response): Promise<void> {
  const categories = await prisma.category.findMany({
    include: {
      tasks: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({
    success: true,
    categories,
  });
}

export async function getSelectedTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const selections = await prisma.userTaskSelection.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    selections: selections.map((s) => ({
      selectionId: s.id,
      taskId: s.taskId,
      name: s.task.name,
      description: s.task.description,
      subcategory: s.task.subcategory,
      categoryName: s.task.category.name,
      categoryIcon: s.task.category.icon,
      status: s.status,
      assignedManager: 'Ravi (Lifestyle Manager)',
      createdAt: s.createdAt,
    })),
  });
}

export async function saveSelectedTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { taskIds } = req.body;

  // Validate tasks exist
  const existingTasks = await prisma.task.findMany({
    where: { id: { in: taskIds } },
  });

  if (existingTasks.length === 0) {
    res.status(400).json({
      success: false,
      error: 'None of the provided tasks were found in the catalogue.',
    });
    return;
  }

  // Create or keep existing selections
  for (const task of existingTasks) {
    await prisma.userTaskSelection.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId: task.id,
        },
      },
      update: {},
      create: {
        userId,
        taskId: task.id,
        status: 'ASSIGNED',
      },
    });
  }

  // Return updated selections
  const currentSelections = await prisma.userTaskSelection.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: `${existingTasks.length} task${existingTasks.length === 1 ? '' : 's'} assigned to your Lifestyle Manager!`,
    selections: currentSelections.map((s) => ({
      selectionId: s.id,
      taskId: s.taskId,
      name: s.task.name,
      description: s.task.description,
      subcategory: s.task.subcategory,
      categoryName: s.task.category.name,
      categoryIcon: s.task.category.icon,
      status: s.status,
      assignedManager: 'Ravi (Lifestyle Manager)',
      createdAt: s.createdAt,
    })),
  });
}
