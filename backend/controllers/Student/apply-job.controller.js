const User = require('../../models/user.model');
const Job = require('../../models/job.model');
const { notifyApplicationReceived } = require('../../utils/emailNotifications');

const AppliedToJob = async (req, res) => {
  try {
    const { studentId, jobId } = req.params;
    if (!studentId || studentId === 'undefined' || !jobId || jobId === 'undefined') {
      return res.status(400).json({ msg: 'Student ID and job ID are required.' });
    }

    const [student, job] = await Promise.all([
      User.findById(studentId),
      Job.findById(jobId).populate('company', 'companyName'),
    ]);

    if (!student || student.role !== 'student') return res.status(404).json({ msg: 'Student not found.' });
    if (!job) return res.status(404).json({ msg: 'Job not found.' });

    if (student.studentProfile?.appliedJobs?.some((application) => String(application.jobId) === String(jobId))) {
      return res.status(409).json({ msg: 'Already Applied!' });
    }

    if (!student.studentProfile?.resume) {
      return res.status(400).json({ msg: 'Please Upload Resume First, Under "Placements" > "Placement Profile"' });
    }

    student.studentProfile.appliedJobs.push({ jobId, status: 'applied' });
    job.applicants.push({ studentId: student._id, status: 'applied' });
    await Promise.all([student.save(), job.save()]);

    // Email the applicant and TPO team after the application is safely stored.
    void notifyApplicationReceived(student, job, job.company?.companyName);

    return res.status(201).json({ msg: 'Applied Successfully!' });
  } catch (error) {
    console.error('apply-job.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const CheckAlreadyApplied = async (req, res) => {
  try {
    const { studentId, jobId } = req.params;
    if (!studentId || studentId === 'undefined' || !jobId || jobId === 'undefined') {
      return res.status(400).json({ msg: 'Student ID and job ID are required.' });
    }

    const user = await User.findById(studentId).select('studentProfile.appliedJobs');
    if (!user) return res.status(404).json({ msg: 'Student not found.' });

    const applied = user.studentProfile?.appliedJobs?.some((application) => String(application.jobId) === String(jobId)) || false;
    return res.json({ applied });
  } catch (error) {
    console.error('apply-job.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

module.exports = { AppliedToJob, CheckAlreadyApplied };
