import React from 'react';
import { HardDrive, Wifi, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import './StatCard.css';

const ICONS = {
  ram: HardDrive,
  net: Wifi,
  scheduled: Clock,
};

/**
 * variant: 'ram' | 'net' | 'scheduled' | custom
 * value: for 'ram' -> 0..1 fraction used; for 'net' -> { up, down } strings; for 'scheduled' -> { count, next }
 */
export default function StatCard({ variant, label, value, icon }) {
  const Icon = icon || ICONS[variant] || HardDrive;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <Icon size={12} />
        <span className="stat-card-label">{label}</span>
        {variant === 'scheduled' && value?.count != null && (
          <span className="stat-card-count">{value.count}</span>
        )}
      </div>

      <div className="stat-card-body">
        {variant === 'ram' && (
          <div className="stat-card-bar-track">
            <div className="stat-card-bar-fill" style={{ width: `${Math.round((value ?? 0) * 100)}%` }} />
          </div>
        )}

        {variant === 'net' && (
          <div className="stat-card-net">
            <span className="stat-card-net-row">
              <ArrowUp size={11} /> {value?.up ?? '--'}
            </span>
            <span className="stat-card-net-row">
              <ArrowDown size={11} /> {value?.down ?? '--'}
            </span>
          </div>
        )}

        {variant === 'scheduled' && (
          <span className="stat-card-next">{value?.next ? `Next: ${value.next}` : 'Nothing scheduled'}</span>
        )}
      </div>
    </div>
  );
}
