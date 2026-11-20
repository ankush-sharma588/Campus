const Job = require('../../models/job.model');
const { notifyJobPosted } = require('../../utils/emailNotifications');

const PostJob = async (req, res) => {
  try {
    const { company, jobTitle, jobDescription, eligibility, salary, howToApply, applicationDeadline } = req.body;

    if (!jobTitle || !jobDescription || !eligibility || !company) {
      return res.status(400).json({ msg: 'Job title, job description, eligibility and company name are required.' });
    }

    const jobData = { company, jobTitle, jobDescription, eligibility, salary, howToApply, applicationDeadline };
    const existingJob = req.body._id ? await Job.findById(req.body._id) : null;

    if (existingJob) {
      Object.assign(existingJob, jobData);
      await existingJob.save();
      return res.status(200).json({ msg: 'Job Updated successfully' });
    }

    const newJob = await Job.create({ ...jobData, postedAt: new Date() });
    const populatedJob = await Job.findById(newJob._id).populate('company', 'companyName');

    // Notify approved students after the job has been saved. Email failures do
    // not roll back a successful job posting.
    void notifyJobPosted(populatedJob, populatedJob.company?.companyName);

    return res.status(201).json({ msg: 'Job posted successfully' });
  } catch (error) {
    console.error('tpo.post-job.controller.js => ', error);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = PostJob;
