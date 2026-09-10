import React from 'react';
import { motion } from 'motion/react';
import AdminLogs from './AdminLogs';

const AdminLogsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      <AdminLogs />
    </motion.div>
  );
};

export default AdminLogsPage;
