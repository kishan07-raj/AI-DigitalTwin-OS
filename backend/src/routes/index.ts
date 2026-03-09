import { Router } from 'express';
import authRoutes from './auth';
import activityRoutes from './activity';
import predictionRoutes from './predictions';
import systemRoutes from './system';
import aiRoutes from './ai';
import notificationsRoutes from './notifications';
import reportsRoutes from './reports';
import teamsRoutes from './teams';
import analyticsRoutes from './analytics';
import historyRoutes from './history';
import exportRoutes from './export';
import twinRoutes from './twin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/activity', activityRoutes);
router.use('/ai', predictionRoutes);
router.use('/system', systemRoutes);
router.use('/ai-engine', aiRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reports', reportsRoutes);
router.use('/teams', teamsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/history', historyRoutes);
router.use('/export', exportRoutes);
router.use('/twin', twinRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;

