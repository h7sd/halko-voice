import { motion } from 'framer-motion';
import halkoImg from '../assets/halko.png';

export default function SplashScreen({ onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        WebkitAppRegion: 'drag',
        overflow: 'hidden',
      }}
    >
      <motion.img
        src={halkoImg}
        alt="Halko"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(20%) brightness(0.6)',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Modern MacOS Progress Bar */}
      <div style={{ position: 'absolute', bottom: 100, width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          onAnimationComplete={onDone}
          style={{ width: '100%', height: '100%', background: '#fff', boxShadow: '0 0 15px rgba(255,255,255,0.5)' }}
        />
      </div>
    </motion.div>
  );
}
