import React from 'react';
import HeroSection from './HeroSection';
import Welcome from './Welcome';
import AcademicPathways from './AcademicPathways';
import Advantage from './Advantage';
import Snapshot from './Snapshot';
import Testimonials from './Testimonials';
import Admission from './Admission';
import News from './News';
import Faq from '../../../components/Faq';
import { useSchoolSettings } from '../../../context/SchoolSettingsContext';

const Home = () => {
  const { settings } = useSchoolSettings();

  return (
    <div className="w-full overflow-x-hidden font-Dm-sans">
      <HeroSection />
      <Welcome />
      <AcademicPathways />
      <Advantage />
      <Snapshot />
      <Testimonials />
      {Boolean(settings?.admission_enabled ?? true) && <Admission />}
      <News />
      <Faq />
    </div>
  );
};

export default Home;

