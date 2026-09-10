import { motion } from 'motion/react';
import TeacherDashboard from './TeacherDashboard';

const TeacherDashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <TeacherDashboard />
    </motion.div>
  );
};

export default TeacherDashboardPage;
