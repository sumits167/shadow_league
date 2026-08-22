import { Notification } from '../models/notification.model.js';
import ApiError from '../utils/ApiError.js';

export const createNotificationService = async ({ userId, title, message, type = "SYSTEM", metadata = {} }) => {
    const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        metadata
    });
    return notification;
};

export const getUserNotificationsService = async (userId) => {
    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return {
        notifications,
        unreadCount
    };
};

export const markNotificationAsReadService = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { read: true } },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
    }

    return notification;
};

export const markAllNotificationsAsReadService = async (userId) => {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return { message: "All notifications marked as read" };
};
