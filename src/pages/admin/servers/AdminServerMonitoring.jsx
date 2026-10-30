import { useState } from 'react';
import {
  Server, HardDrive, Cpu, Activity, Wifi, Globe, RefreshCw,
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, Database, Zap, Lightbulb, Mail, Cloud
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSystemHealth, useTestProxyConnection, useTestSystemEmail } from '../../../services/systemHealth.js';
import Button from '../../../components/Button.jsx';
import SkeletonBase from '../../../components/skeletons/SkeletonBase.jsx';

const STATUS_CONFIG = {
  ok: { label: 'Ổn định', color: '#3FBF8F', bg: 'rgba(63,191,143, 0.1)', icon: CheckCircle2 },
  degraded: { label: 'Cần chú ý', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', icon: AlertTriangle },
  down: { label: 'Sự cố / Mất kết nối', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', icon: XCircle },
  blocked: { label: 'Bị chặn (403 VPA)', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', icon: AlertTriangle },
  not_configured: { label: 'Chế độ trực tiếp', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: AlertTriangle },
};

const SERVICE_BADGE = {
  ok: { label: 'Hoạt động tốt', color: '#3FBF8F' },
  degraded: { label: 'Cần kiểm tra', color: '#d97706' },
  down: { label: 'Lỗi kết nối', color: '#dc2626' },
  in_memory: { label: 'L1 In-Memory', color: '#3FBF8F' },
};

const CRAWL_STATUS_LABEL = {
  Succeeded: { label: 'Thành công', color: '#3FBF8F' },
  Running: { label: 'Đang chạy…', color: '#2563eb' },
  Failed: { label: 'Thất bại', color: '#dc2626' },
  Blocked: { label: 'Bị chặn 403', color: '#ea580c' },
  Cancelled: { label: 'Đã dừng', color: '#6b7280' },
};

export default function AdminServerMonitoring() {
  const { data: healthData, isLoading, isError, refetch, isFetching } = useSystemHealth();
  const { testProxy } = useTestProxyConnection();
  const { sendTestEmail } = useTestSystemEmail();
  const [testingProxy, setTestingProxy] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const handleTestProxy = async () => {
    setTestingProxy(true);
    try {
      const res = await testProxy();
      const p = res?.data || res;
      const status = p?.status || p?.Status;
      const latency = p?.latencyMs ?? p?.LatencyMs;
      const exitIp = p?.exitIp || p?.ExitIp;
      const errMsg = p?.errorMessage || p?.ErrorMessage;

      if (status === 'ok') {
        toast.success(`Kết nối VPA tốt! Độ trễ: ${latency}ms, IP: ${exitIp || 'VN'}`);
      } else if (status === 'blocked') {
        toast.error('Kết nối được nhưng IP bị VPA chặn (403 Cloudflare)!');
      } else {
        toast.error(`Kiểm tra kết nối VPA: ${errMsg || 'Cần kiểm tra cấu hình Proxy'}`);
      }
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi gọi API kiểm tra proxy.');
    } finally {
      setTestingProxy(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await sendTestEmail();
      toast.success(typeof res === 'string' ? res : (res?.data || 'Đã gửi email kiểm tra thành công!'));
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Gửi email kiểm tra thất bại.');
    } finally {
      setTestingEmail(false);
    }
  };

  const main = healthData?.mainServer || healthData?.MainServer;
  const proxy = healthData?.proxyServer || healthData?.ProxyServer;
  const metrics = healthData?.serverMetrics || healthData?.ServerMetrics;
  const jobs = healthData?.jobsLastRun || healthData?.JobsLastRun || [];

  // Chuẩn hóa thông số Máy chủ 1 (hỗ trợ cả camelCase & PascalCase)
  const mainRole = main?.role || main?.Role || 'Application, Web, PostgreSQL & Background Worker';
  const mainStatus = main?.status || main?.Status || (healthData?.dbStatus === 'ok' ? 'ok' : 'degraded');
  const rawDisk = main?.disk || main?.Disk;
  const disk = rawDisk ? {
    driveName: rawDisk.driveName || rawDisk.DriveName || '/',
    usedGb: rawDisk.usedGb ?? rawDisk.UsedGb ?? 0,
    totalGb: rawDisk.totalGb ?? rawDisk.TotalGb ?? 0,
    freeGb: rawDisk.freeGb ?? rawDisk.FreeGb ?? 0,
    usedPercent: rawDisk.usedPercent ?? rawDisk.UsedPercent ?? 0,
    status: rawDisk.status || rawDisk.Status || 'ok',
  } : null;

  const rawMem = main?.memory || main?.Memory;
  const memory = rawMem ? {
    usedMb: rawMem.usedMb ?? rawMem.UsedMb ?? 0,
    totalMb: rawMem.totalMb ?? rawMem.TotalMb ?? 0,
    freeMb: rawMem.freeMb ?? rawMem.FreeMb ?? 0,
    usedPercent: rawMem.usedPercent ?? rawMem.UsedPercent ?? 0,
    processMemoryMb: rawMem.processMemoryMb ?? rawMem.ProcessMemoryMb ?? metrics?.memoryUsedMb ?? 0,
  } : null;

  const processorCount = main?.processorCount ?? main?.ProcessorCount ?? metrics?.processorCount ?? 2;
  const threadCount = main?.threadCount ?? main?.ThreadCount ?? 0;
  const uptimeFormatted = main?.uptimeFormatted || main?.UptimeFormatted || metrics?.uptimeFormatted || 'Đang chạy';
  const dbLatencyMs = main?.dbLatencyMs ?? main?.DbLatencyMs ?? healthData?.dbLatencyMs;
  const dbStatus = main?.dbStatus || main?.DbStatus || healthData?.dbStatus || 'ok';
  const databaseSize = main?.databaseSize || main?.DatabaseSize;
  const osDescription = main?.osDescription || main?.OsDescription || metrics?.osDescription || '.NET Runtime';
  const dotNetVersion = main?.dotNetVersion || main?.DotNetVersion || metrics?.dotNetVersion || '';
  const hostname = main?.hostname || main?.Hostname || '';
  const architecture = main?.architecture || main?.Architecture || '';
  const emailStatus = main?.emailStatus || healthData?.emailStatus || 'ok';
  const cloudinaryStatus = main?.cloudinaryStatus || healthData?.cloudinaryStatus || 'ok';
  const redisStatus = main?.redisStatus || healthData?.redisStatus || 'in_memory';

  // Chuẩn hóa thông số Máy chủ 2 (Proxy VPA Crawler)
  const proxyStatus = proxy?.status || proxy?.Status || 'not_configured';
  const proxyIsConfigured = proxy?.isConfigured ?? proxy?.IsConfigured ?? false;
  const proxyMaskedEndpoint = proxy?.maskedEndpoint || proxy?.MaskedEndpoint || 'Chưa thiết lập';
  const proxyExitIp = proxy?.exitIp || proxy?.ExitIp;
  const proxyCountry = proxy?.country || proxy?.Country || (proxy?.isVietnamIp ? 'VN' : null);
  const proxyIsp = proxy?.ispOrOrg || proxy?.IspOrOrg;
  const proxyLatencyMs = proxy?.latencyMs ?? proxy?.LatencyMs;
  const proxyVpaStatus = proxy?.vpaStatus || proxy?.VpaStatus;
  const proxyLastTestedAt = proxy?.lastTestedAt || proxy?.LastTestedAt;
  const proxyErrorMessage = proxy?.errorMessage || proxy?.ErrorMessage;
  const vpaScheduleEnabled = proxy?.vpaScheduleEnabled ?? proxy?.VpaScheduleEnabled ?? false;
  const vpaCrawlPaused = proxy?.vpaCrawlPaused ?? proxy?.VpaCrawlPaused ?? false;
  const totalVpaPlates = proxy?.totalVpaPlates ?? proxy?.TotalVpaPlates ?? 0;
  const totalVpaResults = proxy?.totalVpaResults ?? proxy?.TotalVpaResults ?? 0;
  const lastCrawlSource = proxy?.lastCrawlSource || proxy?.LastCrawlSource;
  const lastCrawlStatus = proxy?.lastCrawlStatus || proxy?.LastCrawlStatus;
  const lastCrawlAt = proxy?.lastCrawlAt || proxy?.LastCrawlAt;
  const lastCrawlItemsSeen = proxy?.lastCrawlItemsSeen ?? proxy?.LastCrawlItemsSeen ?? 0;
  const lastCrawlInserted = proxy?.lastCrawlInserted ?? proxy?.LastCrawlInserted ?? 0;
  const lastCrawlUpdated = proxy?.lastCrawlUpdated ?? proxy?.LastCrawlUpdated ?? 0;
  const lastCrawlError = proxy?.lastCrawlError || proxy?.LastCrawlError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Header thanh công cụ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>
            Giám sát Máy chủ &amp; Hạ tầng (2 Nodes)
          </h2>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Theo dõi thời gian thực hiệu năng tài nguyên của VPS Chính và trạng thái định tuyến của Máy chủ Proxy cào dữ liệu VPA.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestEmail}
            disabled={testingEmail}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} />
              {testingEmail ? 'Đang gửi thử…' : 'Gửi Email Test'}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Đang cập nhật…' : 'Làm mới số liệu'}
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleTestProxy}
            disabled={testingProxy}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} className={testingProxy ? 'animate-spin' : ''} />
              {testingProxy ? 'Đang kiểm tra Proxy…' : 'Ping Proxy VPA'}
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--gutter-section)' }}>
          <SkeletonBase height={380} />
          <SkeletonBase height={380} />
        </div>
      ) : isError ? (
        <div style={{ background: 'var(--white)', padding: 'var(--gutter-card)', borderRadius: 'var(--radius-card)', textAlign: 'center', color: 'var(--status-danger)' }}>
          Không thể lấy dữ liệu tình trạng máy chủ.
          <button type="button" onClick={() => refetch()} style={{ marginLeft: 8, color: 'var(--link)', border: 'none', background: 'none', cursor: 'pointer' }}>Thử lại</button>
        </div>
      ) : (
        <>
          {/* Lưới 2 Máy chủ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--gutter-section)' }}>

            {/* MÁY CHỦ 1: VPS CHÍNH */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Card Header */}
              <div style={{
                padding: 'var(--space-4) var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)' }}>
                    <Server size={20} />
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      Máy chủ 1: VPS Chính (Core Server)
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {mainRole}{hostname ? ` · Host: ${hostname}` : ''}
                    </div>
                  </div>
                </div>

                {(() => {
                  const cfg = STATUS_CONFIG[mainStatus] || STATUS_CONFIG.ok;
                  const Icon = cfg.icon;
                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 12,
                      fontWeight: 'var(--fw-semibold)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Icon size={13} /> {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Card Body */}
              <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* 1. Dung lượng ổ đĩa */}
                {disk && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                        <HardDrive size={15} style={{ color: 'var(--action-primary)' }} /> Dung lượng Ổ đĩa ({disk.driveName})
                      </span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Đã dùng: <b style={{ color: 'var(--text-strong)' }}>{disk.usedGb} GB</b> / {disk.totalGb} GB
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--grey-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, disk.usedPercent)}%`,
                        height: '100%',
                        background: disk.status === 'danger' ? 'var(--status-danger)' : (disk.status === 'warning' ? '#f59e0b' : '#3FBF8F'),
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
                      <span>Còn trống: <b style={{ color: '#3FBF8F' }}>{disk.freeGb} GB</b></span>
                      <span>Mức sử dụng: <b>{disk.usedPercent}%</b></span>
                    </div>
                  </div>
                )}

                {/* 2. Bộ nhớ RAM */}
                {memory && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                        <Activity size={15} style={{ color: '#8A8F99' }} /> Bộ nhớ RAM Hệ thống
                      </span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Đã dùng: <b style={{ color: 'var(--text-strong)' }}>{Number(memory.usedMb).toLocaleString('vi-VN')} MB</b> / {Number(memory.totalMb).toLocaleString('vi-VN')} MB
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--grey-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, memory.usedPercent)}%`,
                        height: '100%',
                        background: memory.usedPercent > 90 ? 'var(--status-danger)' : (memory.usedPercent > 75 ? '#f59e0b' : '#F19720'),
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
                      <span>Tiến trình .NET (Working Set): <b style={{ color: 'var(--text-strong)' }}>{memory.processMemoryMb} MB</b> · Trống: <b>{Number(memory.freeMb).toLocaleString('vi-VN')} MB</b></span>
                      <span>Tải RAM: <b>{memory.usedPercent}%</b></span>
                    </div>
                  </div>
                )}

                {/* 3. Lưới thông số kỹ thuật */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <div style={{ padding: '9px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Cpu size={12} /> CPU &amp; Tiến trình
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', marginTop: 2 }}>
                      {processorCount} vCPU Cores{threadCount > 0 ? ` · ${threadCount} Threads` : ''}
                    </div>
                  </div>

                  <div style={{ padding: '9px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Thời gian Uptime
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', marginTop: 2 }}>
                      {uptimeFormatted}
                    </div>
                  </div>

                  <div style={{ padding: '9px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Database size={12} /> PostgreSQL Database
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: dbStatus !== 'ok' ? '#dc2626' : ((dbLatencyMs || 0) > 100 ? '#ea580c' : '#3FBF8F'), marginTop: 2 }}>
                      {dbStatus === 'ok' ? 'Online' : 'Mất kết nối'}
                      {dbLatencyMs != null ? ` (${dbLatencyMs} ms)` : ''}
                      {databaseSize ? ` · ${databaseSize}` : ''}
                    </div>
                  </div>

                  <div style={{ padding: '9px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={12} /> Hệ điều hành &amp; Runtime
                    </div>
                    <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${osDescription} · .NET ${dotNetVersion}`}>
                      {osDescription}{architecture ? ` (${architecture})` : ''}{dotNetVersion ? ` · .NET ${dotNetVersion}` : ''}
                    </div>
                  </div>
                </div>

                {/* 4. Dịch vụ phụ trợ trên VPS */}
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  font: 'var(--type-caption)',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                    SMTP Email:{' '}
                    <b style={{ color: (SERVICE_BADGE[emailStatus] || SERVICE_BADGE.ok).color }}>
                      {(SERVICE_BADGE[emailStatus] || SERVICE_BADGE.ok).label}
                    </b>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Cloud size={13} style={{ color: 'var(--text-muted)' }} />
                    Cloudinary CDN:{' '}
                    <b style={{ color: (SERVICE_BADGE[cloudinaryStatus] || SERVICE_BADGE.ok).color }}>
                      {(SERVICE_BADGE[cloudinaryStatus] || SERVICE_BADGE.ok).label}
                    </b>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} style={{ color: 'var(--text-muted)' }} />
                    Cache Layer:{' '}
                    <b style={{ color: (SERVICE_BADGE[redisStatus] || SERVICE_BADGE.ok).color }}>
                      {redisStatus === 'ok' ? 'Redis L2 + L1' : 'L1 In-Memory'}
                    </b>
                  </span>
                </div>
              </div>
            </div>

            {/* MÁY CHỦ 2: PROXY SERVER CÀO VPA */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Card Header */}
              <div style={{
                padding: 'var(--space-4) var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C75B00' }}>
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      Máy chủ 2: Proxy Cào VPA (Crawler Node)
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Node định tuyến IP Việt Nam thu thập dữ liệu Cổng Đấu giá VPA
                    </div>
                  </div>
                </div>

                {(() => {
                  const cfg = STATUS_CONFIG[proxyStatus] || STATUS_CONFIG.not_configured;
                  const Icon = cfg.icon;
                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 12,
                      fontWeight: 'var(--fw-semibold)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Icon size={13} /> {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Card Body */}
              <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* 1. Endpoint & IP */}
                <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chế độ &amp; Địa chỉ Endpoint:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', background: 'var(--white)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)', fontSize: 12 }}>
                      {proxyMaskedEndpoint}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)', marginTop: 2, gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>IP Ra Internet (Exit IP):</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      <Globe size={13} style={{ color: '#C75B00' }} />
                      {proxyExitIp ? (
                        <>
                          <span style={{ fontFamily: 'monospace' }}>{proxyExitIp}</span>
                          {proxyCountry && (
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: proxyCountry === 'VN' ? '#3FBF8F' : '#f59e0b',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                            }}>
                              {proxyCountry}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>Đang nhận diện…</span>
                      )}
                    </span>
                  </div>

                  {(proxyIsp || proxyLastTestedAt) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                      <span>ISP/Mạng: <b style={{ color: 'var(--text-body)' }}>{proxyIsp || (proxyIsConfigured ? 'Proxy Tunnel' : 'Mạng máy chủ')}</b></span>
                      {proxyLastTestedAt && (
                        <span>Kiểm tra lúc: <b>{new Date(proxyLastTestedAt).toLocaleTimeString('vi-VN')}</b></span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Sức khỏe kết nối & VPA Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <div style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Độ trễ tới Cổng VPA
                    </div>
                    <div style={{ font: 'var(--type-title-3)', color: (proxyLatencyMs || 0) > 2000 ? '#ea580c' : '#3FBF8F', marginTop: 2 }}>
                      {proxyLatencyMs != null && proxyLatencyMs > 0 ? `${proxyLatencyMs} ms` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      {proxyIsConfigured ? 'Từ VPS xuyên qua Proxy' : 'Từ VPS tới vpa.com.vn'}
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Trạng thái API VPA
                    </div>
                    <div style={{
                      font: 'var(--type-body-sm)',
                      fontWeight: 'var(--fw-bold)',
                      color: proxyVpaStatus === 'ok' ? '#3FBF8F' : (proxyVpaStatus === 'blocked_403' ? '#dc2626' : '#d97706'),
                      marginTop: 4
                    }}>
                      {proxyVpaStatus === 'ok'
                        ? 'Thành công (200 OK)'
                        : proxyVpaStatus === 'blocked_403'
                          ? 'Bị chặn (403 Cloudflare)'
                          : proxyVpaStatus === 'rate_limited'
                            ? 'Giới hạn tần suất (429)'
                            : (proxyVpaStatus || 'Chưa kiểm tra')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      Endpoint: vpa.com.vn/v2/public
                    </div>
                  </div>
                </div>

                {/* 3. Số liệu vận hành Crawler VPA thực tế */}
                <div style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      Thống kê Dữ liệu &amp; Tiến trình Cào VPA
                    </span>
                    <span style={{
                      fontWeight: 'var(--fw-semibold)',
                      color: vpaCrawlPaused ? '#dc2626' : (vpaScheduleEnabled ? '#3FBF8F' : '#d97706'),
                    }}>
                      {vpaCrawlPaused ? 'Đang tạm dừng khẩn' : (vpaScheduleEnabled ? 'Lịch tự động: BẬT' : 'Lịch tự động: TẮT')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    <span>Kho biển VPA: <b style={{ color: 'var(--text-strong)' }}>{Number(totalVpaPlates).toLocaleString('vi-VN')} biển</b></span>
                    <span>•</span>
                    <span>Kết quả đấu giá: <b style={{ color: 'var(--text-strong)' }}>{Number(totalVpaResults).toLocaleString('vi-VN')} bản ghi</b></span>
                  </div>

                  {lastCrawlSource ? (
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border-hairline)', paddingTop: 6, marginTop: 2 }}>
                      Lượt cào gần nhất: <b style={{ color: 'var(--text-strong)' }}>{lastCrawlSource}</b> ·{' '}
                      <b style={{ color: (CRAWL_STATUS_LABEL[lastCrawlStatus] || { color: 'var(--text-strong)' }).color }}>
                        {(CRAWL_STATUS_LABEL[lastCrawlStatus] || { label: lastCrawlStatus }).label}
                      </b>
                      {lastCrawlAt ? ` (${new Date(lastCrawlAt).toLocaleString('vi-VN')})` : ''} · Quét{' '}
                      <b>{Number(lastCrawlItemsSeen).toLocaleString('vi-VN')}</b> biển (+{lastCrawlInserted} mới, ~{lastCrawlUpdated} cập nhật)
                    </div>
                  ) : null}
                </div>

                {/* Thông báo lỗi nếu có */}
                {(proxyErrorMessage || lastCrawlError) && (
                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', fontSize: 12 }}>
                    {proxyErrorMessage && <div><b>Cảnh báo kết nối:</b> {proxyErrorMessage}</div>}
                    {lastCrawlError && <div><b>Lỗi lượt cào gần nhất:</b> {lastCrawlError}</div>}
                  </div>
                )}

                {/* Ghi chú hướng dẫn proxy */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <span>
                    <b>Cơ chế định tuyến 2 Server:</b> Toàn bộ module cào dữ liệu (<code>IVpaApiClient</code>) định tuyến các lượt crawl danh sách biển công bố, biển chính thức và kết quả đấu giá qua Proxy IP Việt Nam (<code>Vpa__Proxy</code>) để tránh lỗi chặn 403 của Cloudflare trên VPS quốc tế.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BACKGROUND JOBS STATUS */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                Tác vụ ngầm &amp; Bộ lập lịch (Background Worker Jobs)
              </span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {jobs.length} tiến trình đang đăng ký
              </span>
            </div>

            <div style={{ padding: 'var(--gutter-card)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
              {jobs.map((job) => (
                <div
                  key={job.jobName}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    font: 'var(--type-caption)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: job.status === 'ok' ? '#3FBF8F' : '#d97706', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {job.jobName}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11, flexShrink: 0 }}>
                    {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString('vi-VN') : 'Đang chờ'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
