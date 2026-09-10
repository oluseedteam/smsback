import { motion } from 'motion/react';
import Messages from './Messages';

const MessagesPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="w-full"
    >
      <Messages />
    </motion.div>
  );
};

export default MessagesPage;
