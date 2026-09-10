import { motion } from 'motion/react';
import TeacherResources from './TeacherResources';

const TeacherResourcesPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherResources />
  </motion.div>
);

export default TeacherResourcesPage;
