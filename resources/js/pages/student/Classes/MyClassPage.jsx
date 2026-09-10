import { motion } from 'motion/react';
import MyClasses from './MyClasses';

const MyClassPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <MyClasses />
    </motion.div>
  );
};

export default MyClassPage;
