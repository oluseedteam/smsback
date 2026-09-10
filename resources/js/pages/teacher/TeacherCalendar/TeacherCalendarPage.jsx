import { motion } from 'motion/react';
import TeacherCalendar from './TeacherCalendar';

const TeacherCalendarPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherCalendar />
  </motion.div>
);

export default TeacherCalendarPage;
