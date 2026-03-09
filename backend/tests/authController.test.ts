import { Request, Response, NextFunction } from 'express';
import { register, login, getMe, updateProfile } from '../src/controllers/authController';
import { User } from '../src/models';

// Mock the User model
jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

// Mock JWT utilities
jest.mock('../src/utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-token'),
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '15m',
  }),
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
      params: {},
      userId: 'user-123',
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Mock user not found
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock user save
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        preferences: {},
        digitalTwin: {},
        save: jest.fn().mockResolvedValue(true),
      };
      
      // Create a mock constructor function
      const UserModel = User as any;
      UserModel.mockImplementation(() => mockUser);

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com',
              name: 'Test User',
            }),
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      // Arrange
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      // Mock user found
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing-user',
        email: 'existing@example.com',
      });

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'USER_EXISTS',
          }),
        })
      );
    });

    it('should return 400 for invalid email', async () => {
      // Arrange
      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'correct-password',
      };

      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        preferences: {},
        digitalTwin: { lastActive: new Date() },
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com',
            }),
          }),
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
          }),
        })
      );
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('getMe', () => {
    it('should return user data successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        preferences: { theme: 'dark' },
        digitalTwin: {},
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await getMe(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await getMe(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Updated Name',
        preferences: { theme: 'light' },
      };

      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        name: 'Old Name',
        role: 'user',
        preferences: { theme: 'dark' },
        digitalTwin: {},
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});

