import React from 'react';
import { motion } from 'motion/react';
import StudentLibrary from './StudentLibrary';

const StudentLibraryPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-4 md:p-8"
    >
      <StudentLibrary />
    </motion.div>
  );
};

export default StudentLibraryPage;
