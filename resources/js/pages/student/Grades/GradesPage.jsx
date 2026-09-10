import { motion } from 'motion/react';
import Grades from './Grades';

const GradesPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full"
    >
      <Grades />
    </motion.div>
  );
};

export default GradesPage;
