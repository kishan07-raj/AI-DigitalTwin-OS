import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Mock team data (in production, this would be in a database)
const teams: any[] = [
  {
    id: 'team1',
    name: 'Engineering',
    description: 'Engineering team productivity',
    ownerId: 'user1',
    members: [
      { userId: 'user1', email: 'john@example.com', name: 'John Doe', role: 'owner', joinedAt: '2024-01-01' },
      { userId: 'user2', email: 'jane@example.com', name: 'Jane Smith', role: 'admin', joinedAt: '2024-01-15' },
      { userId: 'user3', email: 'bob@example.com', name: 'Bob Wilson', role: 'member', joinedAt: '2024-02-01' },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: 'team2',
    name: 'Marketing',
    description: 'Marketing team analytics',
    ownerId: 'user1',
    members: [
      { userId: 'user1', email: 'john@example.com', name: 'John Doe', role: 'owner', joinedAt: '2024-01-01' },
      { userId: 'user4', email: 'emma@example.com', name: 'Emma Johnson', role: 'admin', joinedAt: '2024-02-01' },
    ],
    createdAt: '2024-02-01',
  },
];

// Get all teams for current user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userTeams = teams.filter(t => 
      t.ownerId === userId || t.members.some((m: any) => m.userId === userId)
    );
    
    res.json({ success: true, teams: userTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEAMS_FETCH_FAILED', message: 'Failed to fetch teams' }
    });
  }
});

// Get a specific team
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    const team = teams.find(t => t.id === id && 
      (t.ownerId === userId || t.members.some((m: any) => m.userId === userId))
    );
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEAM_NOT_FOUND', message: 'Team not found' }
      });
    }
    
    res.json({ success: true, team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEAM_FETCH_FAILED', message: 'Failed to fetch team' }
    });
  }
});

// Create a new team
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description } = req.body;
    
    const newTeam = {
      id: `team_${Date.now()}`,
      name,
      description: description || '',
      ownerId: userId,
      members: [
        { userId, email: (req as any).user.email, name: (req as any).user.name, role: 'owner', joinedAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
    };
    
    teams.push(newTeam);
    
    res.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEAM_CREATE_FAILED', message: 'Failed to create team' }
    });
  }
});

// Add a member to a team
router.post('/:id/members', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { email } = req.body;
    
    const team = teams.find(t => t.id === id && t.ownerId === userId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEAM_NOT_FOUND', message: 'Team not found or unauthorized' }
      });
    }
    
    // In production, this would look up the user by email
    const newMember = {
      userId: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'member',
      joinedAt: new Date().toISOString(),
    };
    
    team.members.push(newMember);
    
    res.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MEMBER_ADD_FAILED', message: 'Failed to add member' }
    });
  }
});

// Remove a member from a team
router.delete('/:id/members/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;
    const ownerId = (req as any).user.id;
    
    const team = teams.find(t => t.id === id && t.ownerId === ownerId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEAM_NOT_FOUND', message: 'Team not found or unauthorized' }
      });
    }
    
    team.members = team.members.filter((m: any) => m.userId !== userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MEMBER_REMOVE_FAILED', message: 'Failed to remove member' }
    });
  }
});

export default router;

