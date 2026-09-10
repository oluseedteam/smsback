import { motion } from 'motion/react';
import TeacherMessages from './TeacherMessages';

const TeacherMessagesPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherMessages />
  </motion.div>
);

export default TeacherMessagesPage;
