import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  GitCompare,
  Radio,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { formatDateTime } from '@/utils/helpers';

export const Timeline = () => {
  const {
    timeline,
    setPlaybackMode,
    setCurrentTime,
    setTimeA,
    setTimeB,
    togglePlayback,
    setPlaybackSpeed,
    getSnapshotAtTime,
  } = useDataCenterStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'current' | 'a' | 'b' | null>(null);
  const animationRef = useRef<number | null>(null);

  const snapshots = timeline.snapshots;
  const minTime = snapshots.length > 0 ? snapshots[0].timestamp : Date.now() - 24 * 60 * 60 * 1000;
  const maxTime = snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : Date.now();

  const getPositionFromTime = useCallback((time: number) => {
    const range = maxTime - minTime;
    if (range === 0) return 0;
    return ((time - minTime) / range) * 100;
  }, [minTime, maxTime]);

  const getTimeFromPosition = useCallback((percent: number) => {
    const range = maxTime - minTime;
    return minTime + (percent / 100) * range;
  }, [minTime, maxTime]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const time = getTimeFromPosition(clampedPercent);

    if (timeline.mode === 'compare') {
      if (!timeline.timeA || (timeline.timeA && timeline.timeB)) {
        setTimeA(time);
        setTimeB(null);
      } else {
        setTimeB(time);
      }
    } else {
      setCurrentTime(time);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const time = getTimeFromPosition(clampedPercent);

    if (isDragging === 'current') {
      setCurrentTime(time);
    } else if (isDragging === 'a') {
      setTimeA(time);
    } else if (isDragging === 'b') {
      setTimeB(time);
    }
  }, [isDragging, getTimeFromPosition, setCurrentTime, setTimeA, setTimeB]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (timeline.isPlaying && timeline.mode === 'playback') {
      const step = 60 * 1000 * timeline.playbackSpeed;
      const animate = () => {
        setCurrentTime((prev) => {
          const next = prev + step / 60;
          if (next >= maxTime) {
            return minTime;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [timeline.isPlaying, timeline.mode, timeline.playbackSpeed, maxTime, minTime, setCurrentTime]);

  const handleSkipBack = () => {
    const step = 60 * 60 * 1000;
    if (timeline.mode === 'compare') {
      if (timeline.timeA) setTimeA(Math.max(minTime, timeline.timeA - step));
    } else {
      setCurrentTime(Math.max(minTime, timeline.currentTime - step));
    }
  };

  const handleSkipForward = () => {
    const step = 60 * 60 * 1000;
    if (timeline.mode === 'compare') {
      if (timeline.timeA) setTimeA(Math.min(maxTime, timeline.timeA + step));
    } else {
      setCurrentTime(Math.min(maxTime, timeline.currentTime + step));
    }
  };

  const handleToggleCompare = () => {
    if (timeline.mode === 'compare') {
      setPlaybackMode('live');
      setTimeA(null);
      setTimeB(null);
    } else {
      setPlaybackMode('compare');
      setTimeA(maxTime - 12 * 60 * 60 * 1000);
      setTimeB(maxTime);
    }
  };

  const handleLiveMode = () => {
    setPlaybackMode('live');
    setTimeA(null);
    setTimeB(null);
  };

  const snapshotA = timeline.mode === 'compare' && timeline.timeA ? getSnapshotAtTime(timeline.timeA) : null;
  const snapshotB = timeline.mode === 'compare' && timeline.timeB ? getSnapshotAtTime(timeline.timeB) : null;

  if (timeline.mode === 'live') {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <button
          onClick={() => setPlaybackMode('playback')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-slate-800/80 transition-all duration-200"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">历史回放</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/30 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {timeline.mode !== 'compare' && (
              <>
                <button
                  onClick={handleSkipBack}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                  title="后退1小时"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlayback}
                  className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                  title={timeline.isPlaying ? '暂停' : '播放'}
                >
                  {timeline.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSkipForward}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                  title="前进1小时"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </>
            )}

            <select
              value={timeline.playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          <div className="flex-1">
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              className="relative h-8 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer"
            >
              <div className="absolute inset-0 flex items-center px-1">
                {snapshots.map((snapshot, i) => {
                  const hasAlert = snapshot.alerts.some((a) => a.level === 'critical');
                  const hasWarning = snapshot.alerts.some((a) => a.level === 'warning');
                  return (
                    <div
                      key={i}
                      className="flex-1 h-1 mx-px rounded-full"
                      style={{
                        backgroundColor: hasAlert
                          ? '#ff4444'
                          : hasWarning
                          ? '#ffcc00'
                          : '#00ff88',
                        opacity: 0.5,
                      }}
                    />
                  );
                })}
              </div>

              {timeline.mode === 'playback' && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize z-10"
                  style={{ left: `${getPositionFromTime(timeline.currentTime)}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging('current');
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-lg shadow-cyan-500/50" />
                </div>
              )}

              {timeline.mode === 'compare' && (
                <>
                  {timeline.timeA && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 cursor-ew-resize z-10"
                      style={{ left: `${getPositionFromTime(timeline.timeA)}%` }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDragging('a');
                      }}
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/50" />
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-blue-500 rounded text-[10px] text-white font-medium whitespace-nowrap">
                        A
                      </div>
                    </div>
                  )}
                  {timeline.timeB && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-orange-500 cursor-ew-resize z-10"
                      style={{ left: `${getPositionFromTime(timeline.timeB)}%` }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDragging('b');
                      }}
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-orange-500/50" />
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-orange-500 rounded text-[10px] text-white font-medium whitespace-nowrap">
                        B
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
              <span>{formatDateTime(minTime)}</span>
              <span>{formatDateTime((minTime + maxTime) / 2)}</span>
              <span>{formatDateTime(maxTime)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleCompare}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  timeline.mode === 'compare'
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                    : 'bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                AB对比
              </button>
              <button
                onClick={handleLiveMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-all duration-200"
              >
                <Radio className="w-3.5 h-3.5" />
                实时
              </button>
            </div>

            <div className="text-xs text-gray-400 font-mono">
              {timeline.mode === 'playback' && formatDateTime(timeline.currentTime)}
              {timeline.mode === 'compare' && timeline.timeA && timeline.timeB && (
                <span className="text-gray-500">
                  <span className="text-blue-400">A</span> ↔ <span className="text-orange-400">B</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {timeline.mode === 'compare' && snapshotA && snapshotB && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">时间A</p>
              <p className="text-sm font-mono text-blue-400">{formatDateTime(snapshotA.timestamp)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">设备数A</p>
              <p className="text-sm font-mono text-white">{snapshotA.stats.totalDevices}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">告警数A</p>
              <p className="text-sm font-mono text-yellow-400">{snapshotA.alerts.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">功耗A</p>
              <p className="text-sm font-mono text-orange-400">{snapshotA.stats.totalPower.toFixed(1)} kW</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
