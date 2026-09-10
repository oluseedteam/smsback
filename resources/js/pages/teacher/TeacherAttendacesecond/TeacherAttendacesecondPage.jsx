import { motion } from 'motion/react';
import TeacherAttendacesecond from './TeacherAttendacesecond';

const TeacherAttendacesecondPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherAttendacesecond />
  </motion.div>
);

export default TeacherAttendacesecondPage;
