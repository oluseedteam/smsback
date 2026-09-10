import React from 'react'
import MediaRoom from './MediaRoom'
import Snapshot from '../home/Snapshot'

const Media = () => {
  return (
    <div className='overflow-hidden'>
        <MediaRoom />
        <Snapshot />
    </div>
  )
}

export default Media