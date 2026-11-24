import { Reveal, Tilt, SplitText } from './Motion';
import Student from '../../assets/student.jpg';
import TPO from '../../assets/tpo.jpg';
import Management from '../../assets/management.jpg';
import Admin from '../../assets/admin.jpg';

function LandAbout() {
  const roles = [
    {
      title: "Student",
      image: Student,
      description:
        "Students can register, explore job opportunities, apply for jobs, and track application status with a personalized dashboard.",
    },
    {
      title: "TPO (Training & Placement Officer)",
      image: TPO,
      description:
        "TPOs manage company data, job postings, application reviews, and generate insightful reports for placement tracking.",
    },
    {
      title: "Management",
      image: Management,
      description:
        "Management can monitor overall placement activities, review analytics, and control system access and quality assurance.",
    },
    {
      title: "Super User (Admin)",
      image: Admin,
      description:
        "Admins handle all roles with super privileges—managing users, system settings, and ensuring smooth operations across modules.",
    },
  ];

  return (
    <div id="about" className="bg-gradient-to-tr from-indigo-50 via-white to-teal-50 py-20 scroll-mt-16">
      <div className="text-center mb-14 px-4">
        <p className="text-teal-600 tracking-[.3em] uppercase text-xs font-semibold mb-3">One platform, four roles</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 playfair text-indigo-950">
          <SplitText text="How PlaceHub works" />
        </h2>
        <Reveal delay={200}>
          <p className="text-base md:text-lg max-w-2xl mx-auto text-gray-600">
            PlaceHub brings students, placement officers and college management onto one platform, so campus recruitment stays organised from the first application to the offer letter.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-10 max-w-7xl mx-auto">
        {roles.map((role, idx) => (
          <Reveal key={idx} delay={idx * 120} className="h-full">
            <Tilt className="bg-white border border-gray-100 shadow-lg rounded-3xl p-5 flex flex-col items-start h-full">
              <img src={role.image} alt={role.title} loading="lazy" className="w-full h-44 object-cover rounded-2xl" />
              <h3 className="text-lg md:text-xl font-bold mt-5 mb-2 text-indigo-900">{role.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{role.description}</p>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default LandAbout;
