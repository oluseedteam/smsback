import { motion } from 'motion/react';
import TeacherCalendarsecond from './TeacherCalendarsecond';

const TeacherCalendarsecondPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherCalendarsecond />
  </motion.div>
);

export default TeacherCalendarsecondPage;
