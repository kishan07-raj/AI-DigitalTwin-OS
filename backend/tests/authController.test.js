"use strict";
/**
 * Auth Controller Unit Tests
 * Tests for authentication endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Mock the User model
const mockUser = {
    findOne: jest.fn(),
    findById: jest.fn(),
};
// Mock jwt
const mockGenerateToken = jest.fn().mockReturnValue('mock-jwt-token');
// Mock the entire module
jest.mock('../src/models', () => ({
    User: mockUser,
}));
jest.mock('../src/utils/jwt', () => ({
    generateToken: mockGenerateToken,
}));
// Import after mocks
const authController_1 = require("../src/controllers/authController");
describe('Auth Controller', () => {
    let mockRequest;
    let mockResponse;
    let jsonMock;
    let statusMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {
            body: {},
            userId: 'mock-user-id',
        };
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
    });
    afterEach(() => {
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
            mockUser.findOne.mockResolvedValue(null);
            const mockSave = jest.fn().mockResolvedValue(true);
            const MockUserClass = jest.fn().mockImplementation(() => ({
                save: mockSave,
                _id: { toString: () => 'mock-user-id' },
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
                preferences: {},
                digitalTwin: {},
            }));
            // Override the mock
            mockUser.mockImplementation(MockUserClass);
            // Act
            await (0, authController_1.register)(mockRequest, mockResponse);
            // Assert
            expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    user: expect.any(Object),
                    token: 'mock-jwt-token',
                }),
            }));
        });
        it('should return 400 if user already exists', async () => {
            // Arrange
            mockRequest.body = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User',
            };
            mockUser.findOne.mockResolvedValue({ email: 'existing@example.com' });
            // Act
            await (0, authController_1.register)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'USER_EXISTS',
                }),
            }));
        });
        it('should return 500 if registration fails', async () => {
            // Arrange
            mockRequest.body = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };
            mockUser.findOne.mockRejectedValue(new Error('Database error'));
            // Act
            await (0, authController_1.register)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'REGISTRATION_FAILED',
                }),
            }));
        });
    });
    describe('login', () => {
        it('should login user successfully', async () => {
            // Arrange
            mockRequest.body = {
                email: 'test@example.com',
                password: 'password123',
            };
            const mockUserDoc = {
                _id: { toString: () => 'mock-user-id' },
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
                preferences: {},
                digitalTwin: { lastActive: new Date() },
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserDoc);
            // Act
            await (0, authController_1.login)(mockRequest, mockResponse);
            // Assert
            expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    user: expect.any(Object),
                    token: 'mock-jwt-token',
                }),
            }));
        });
        it('should return 401 if user not found', async () => {
            // Arrange
            mockRequest.body = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };
            mockUser.findOne.mockResolvedValue(null);
            // Act
            await (0, authController_1.login)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'INVALID_CREDENTIALS',
                }),
            }));
        });
        it('should return 401 if password is invalid', async () => {
            // Arrange
            mockRequest.body = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            const mockUserDoc = {
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            mockUser.findOne.mockResolvedValue(mockUserDoc);
            // Act
            await (0, authController_1.login)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'INVALID_CREDENTIALS',
                }),
            }));
        });
    });
    describe('getMe', () => {
        it('should return user profile successfully', async () => {
            // Arrange
            const mockUserDoc = {
                _id: { toString: () => 'mock-user-id' },
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
                preferences: {},
                digitalTwin: {},
            };
            mockUser.findById.mockResolvedValue(mockUserDoc);
            // Act
            await (0, authController_1.getMe)(mockRequest, mockResponse);
            // Assert
            expect(mockUser.findById).toHaveBeenCalledWith('mock-user-id');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockUserDoc,
            }));
        });
        it('should return 404 if user not found', async () => {
            // Arrange
            mockUser.findById.mockResolvedValue(null);
            // Act
            await (0, authController_1.getMe)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'USER_NOT_FOUND',
                }),
            }));
        });
    });
    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            // Arrange
            mockRequest.body = {
                name: 'Updated Name',
                preferences: { theme: 'dark' },
            };
            const mockUserDoc = {
                _id: { toString: () => 'mock-user-id' },
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
                preferences: {},
                digitalTwin: {},
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findById.mockResolvedValue(mockUserDoc);
            // Act
            await (0, authController_1.updateProfile)(mockRequest, mockResponse);
            // Assert
            expect(mockUser.findById).toHaveBeenCalledWith('mock-user-id');
            expect(mockUserDoc.name).toBe('Updated Name');
            expect(mockUserDoc.preferences).toEqual({ theme: 'dark' });
            expect(statusMock).toHaveBeenCalledWith(200);
        });
        it('should return 404 if user not found', async () => {
            // Arrange
            mockUser.findById.mockResolvedValue(null);
            // Act
            await (0, authController_1.updateProfile)(mockRequest, mockResponse);
            // Assert
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'USER_NOT_FOUND',
                }),
            }));
        });
    });
});
//# sourceMappingURL=authController.test.js.map