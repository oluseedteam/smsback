import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';

const HomeworkPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Outlet />
    </motion.div>
  );
};

export default HomeworkPage;
