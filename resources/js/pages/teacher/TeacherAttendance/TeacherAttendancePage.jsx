import { motion } from 'motion/react';
import TeacherAttendance from './TeacherAttendance';

const TeacherAttendancePage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherAttendance />
  </motion.div>
);

export default TeacherAttendancePage;
