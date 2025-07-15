import React from 'react';
import { PowerUpType, POWER_UPS } from '../types';
import { motion } from 'framer-motion';

interface PowerUpsProps {
  powerUps: Record<PowerUpType, number>;
  onUse: (type: PowerUpType) => void;
  disabled: boolean;
}

const PowerUps: React.FC<PowerUpsProps> = ({ powerUps, onUse, disabled }) => {
  const powerUpKeys = Object.keys(powerUps) as PowerUpType[];

  return (
    <div className="w-full max-w-2xl mx-auto p-2 bg-brand-white text-brand-black border-4 border-black shadow-hard">
      <div className="flex justify-around items-center gap-2">
        {powerUpKeys.map((type) => {
          const count = powerUps[type];
          const isButtonDisabled = disabled || count === 0;
          return (
            <motion.button
              key={type}
              onClick={() => onUse(type)}
              disabled={isButtonDisabled}
              className="flex-grow flex flex-col items-center justify-center p-2 border-2 border-black font-bold transition-all disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isButtonDisabled ? '#A0A0A0' : '#FFFF00',
                boxShadow: isButtonDisabled ? 'none' : '2px 2px 0px #000',
              }}
              whileHover={!isButtonDisabled ? { y: -2, x: -2, boxShadow: '4px 4px 0px #000' } : {}}
              whileTap={!isButtonDisabled ? { y: 0, x: 0, boxShadow: '2px 2px 0px #000' } : {}}
            >
              <div className="text-lg md:text-xl">
                {POWER_UPS[type].icon} {POWER_UPS[type].name}
              </div>
              <div className="text-xs font-mono bg-brand-black text-brand-white px-2 py-0.5 rounded-full">
                x{count}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PowerUps;