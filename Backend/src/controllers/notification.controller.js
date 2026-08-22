import {
    getUserNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService
} from '../services/notification.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const result = await getUserNotificationsService(userId);
    return res.status(200).json(new ApiResponse(200, result, "Notifications fetched successfully", true));
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const notification = await markNotificationAsReadService(notificationId, userId);
    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read", true));
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const result = await markAllNotificationsAsReadService(userId);
    return res.status(200).json(new ApiResponse(200, result, "All notifications marked as read", true));
});
