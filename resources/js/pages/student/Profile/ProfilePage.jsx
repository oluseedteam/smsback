import { motion } from 'motion/react';
import Profile from './Profile';

const ProfilePage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="w-full"
    >
      <Profile />
    </motion.div>
  );
};

export default ProfilePage;
