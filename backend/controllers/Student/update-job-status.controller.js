const User = require('../../models/user.model');
const Job = require('../../models/job.model');
const { notifyApplicationStatus } = require('../../utils/emailNotifications');

const FIELD_LABELS = {
  status: 'Application status',
  currentRound: 'Current interview round',
  roundStatus: 'Interview round result',
  selectionDate: 'Selection date',
  joiningDate: 'Joining date',
  offerLetter: 'Offer letter',
  package: 'Offered package (LPA)',
};

function formatValue(field, value) {
  if (value instanceof Date || field === 'selectionDate' || field === 'joiningDate') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN');
  }
  if (field === 'offerLetter' && value) return String(value);
  return String(value);
}

const UpdateJobStatus = async (req, res) => {
  try {
    const { jobId, studentId } = req.params;
    const updates = req.body?.applicant;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ msg: 'Applicant update data is required.' });
    }

    const [job, student] = await Promise.all([
      Job.findById(jobId).populate('company', 'companyName'),
      User.findById(studentId),
    ]);

    if (!job || !student) return res.status(404).json({ msg: 'Student or Job Not Found!' });

    const jobApplicant = job.applicants.find((entry) => String(entry.studentId) === String(studentId));
    const studentApplication = student.studentProfile?.appliedJobs?.find((entry) => String(entry.jobId) === String(jobId));
    if (!jobApplicant || !studentApplication) {
      return res.status(404).json({ msg: 'This student application was not found.' });
    }

    const changed = [];
    const allowedFields = ['currentRound', 'roundStatus', 'selectionDate', 'joiningDate', 'offerLetter', 'status'];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(updates, field) || updates[field] === undefined || updates[field] === '') continue;
      const previous = jobApplicant[field];
      const next = updates[field];
      const previousString = previous instanceof Date ? previous.toISOString() : String(previous ?? '');
      const nextString = next instanceof Date ? next.toISOString() : String(next);
      if (previousString !== nextString) {
        jobApplicant[field] = next;
        changed.push([FIELD_LABELS[field], formatValue(field, next)]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      studentApplication.status = updates.status;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'package') && updates.package !== '') {
      const oldPackage = studentApplication.package;
      studentApplication.package = updates.package;
      if (String(oldPackage ?? '') !== String(updates.package)) {
        changed.push([FIELD_LABELS.package, formatValue('package', updates.package)]);
      }
    }

    await Promise.all([student.save(), job.save()]);

    if (changed.length && student.email) {
      void notifyApplicationStatus(student, job, changed);
    }

    return res.json({ msg: 'Job Status Updated Successfully!' });
  } catch (error) {
    console.error('update-job-status.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

module.exports = { UpdateJobStatus };
