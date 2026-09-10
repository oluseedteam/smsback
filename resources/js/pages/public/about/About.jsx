import React from 'react';
import Philosophy from './Philosophy';
import OurSchool from './OurSchool';
import Vision from './Vision';
import Commitment from './Commitment';
import Snapshot from '../home/Snapshot';
import Faq from '../../../components/Faq';

const About = () => {
  return (
    <div className="w-full overflow-x-hidden font-Dm-sans">
      <Philosophy />
      <OurSchool />
      <Vision />
      <Commitment />
      <Snapshot />
      <Faq />
    </div>
  );
};

export default About;

