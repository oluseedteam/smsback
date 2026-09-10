import React from 'react';
import { motion } from 'motion/react';
import AdminDashboard from './AdminDashboard';

const AdminDashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      <AdminDashboard />
    </motion.div>
  );
};

export default AdminDashboardPage;
