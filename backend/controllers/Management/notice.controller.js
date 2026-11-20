const mongoose = require('mongoose');
const Notice = require('../../models/notice.model');
const { notifyNotice } = require('../../utils/emailNotifications');

const SendNotice = async (req, res) => {
  try {
    const receiver_role = req.body.receiver_role || 'student';
    const { sender_role, title, message, sender } = req.body;

    if (!sender || !mongoose.isValidObjectId(sender) || !message?.trim()) {
      return res.status(400).json({ msg: 'A valid sender and notice message are required.' });
    }
    if (!['student', 'tpo_admin', 'management_admin'].includes(receiver_role)) {
      return res.status(400).json({ msg: 'Invalid notice recipient role.' });
    }

    const notice = await Notice.create({
      sender: new mongoose.Types.ObjectId(sender),
      sender_role,
      receiver_role,
      title: title || 'New college notice',
      message: message.trim(),
    });

    // Store the notice first, then email the selected audience.
    void notifyNotice(receiver_role, notice, sender_role);
    return res.status(201).json({ msg: 'Notice published successfully. Email notifications were processed.' });
  } catch (error) {
    console.error('error in notice.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const GetAllNotice = async (req, res) => {
  try {
    const notices = await Notice.find();
    return res.json(notices);
  } catch (error) {
    console.error('error in notice.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const GetNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.query.noticeId);
    return res.json(notice);
  } catch (error) {
    console.error('error in notice.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const DeleteNotice = async (req, res) => {
  try {
    if (!req.query.noticeId) return res.status(400).json({ msg: 'Error while deleting notice!' });
    await Notice.findByIdAndDelete(req.query.noticeId);
    return res.json({ msg: 'Notice Deleted Successfully!' });
  } catch (error) {
    console.error('error in notice.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

module.exports = { SendNotice, GetAllNotice, DeleteNotice, GetNotice };
