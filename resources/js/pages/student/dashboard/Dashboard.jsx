import React from 'react'
import Welcome from './Welcome'
import Classes from './Classes'
import Homework from './Homework'
import StarStudent from './StarStudent'
import Events from './Events'
import Achievements from './Achievements'
import { motion } from 'motion/react'

const Dashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className='grid grid-cols-1 lg:grid-cols-12 gap-6'
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className='lg:col-span-8 space-y-6'>
        <motion.div variants={itemVariants}><Welcome/></motion.div>
        <motion.div variants={itemVariants}><Classes /></motion.div>
        <motion.div variants={itemVariants}><Homework /></motion.div>
      </div>
      <div className='lg:col-span-4 space-y-6'>
        <motion.div variants={itemVariants}><StarStudent /></motion.div>
        <motion.div variants={itemVariants}><Events /></motion.div>
        <motion.div variants={itemVariants}><Achievements /></motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard
