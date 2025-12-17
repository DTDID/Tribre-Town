import React, { useEffect, useState } from 'react';

const DEFAULT_CLOUD_IMG = "https://town.trib.re/assets/tiles/decor_cloud.png";

interface CloudLayerProps {
  customImage?: string;
}

const CloudLayer: React.FC<CloudLayerProps> = ({ customImage }) => {
  const [clouds, setClouds] = useState<{id: number, top: number, size: number, duration: number, delay: number, opacity: number}[]>([]);

  useEffect(() => {
    const newClouds = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      top: Math.random() * 80,
      size: 100 + Math.random() * 150,
      duration: 30 + Math.random() * 40,
      delay: -(Math.random() * 60),
      opacity: 0.4 + Math.random() * 0.4
    }));
    setClouds(newClouds);
  }, []);

  const cloudUrl = customImage || DEFAULT_CLOUD_IMG;

  return (
    <div className="absolute inset-0 pointer-events-none z-[40] overflow-hidden">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="absolute animate-drift bg-contain bg-no-repeat"
          style={{
            backgroundImage: `url(${cloudUrl})`,
            top: `${cloud.top}vh`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default React.memo(CloudLayer);