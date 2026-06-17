const Icon = ({ d, size = 18, color = 'currentColor', stroke = 1.5, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...props}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const IcDashboard   = p => <Icon {...p} d={['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z','M9 22V12h6v10']} />;
export const IcTasks       = p => <Icon {...p} d={['M9 11l3 3L22 4','M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11']} />;
export const IcAlert       = p => <Icon {...p} d={['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01']} />;
export const IcUsers       = p => <Icon {...p} d={['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 3a4 4 0 010 8','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75']} />;
export const IcSummary     = p => <Icon {...p} d={['M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z','M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z']} />;
export const IcReports     = p => <Icon {...p} d={['M18 20V10','M12 20V4','M6 20v-6']} />;
export const IcPlus        = p => <Icon {...p} d={['M12 5v14','M5 12h14']} />;
export const IcEdit        = p => <Icon {...p} d={['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z']} />;
export const IcTrash       = p => <Icon {...p} d={['M3 6h18','M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6','M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2']} />;
export const IcSearch      = p => <Icon {...p} d={['M11 19a8 8 0 100-16 8 8 0 000 16z','M21 21l-4.35-4.35']} />;
export const IcUser        = p => <Icon {...p} d={['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2','M12 3a4 4 0 010 8']} />;
export const IcShield      = p => <Icon {...p} d={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']} />;
export const IcCalendar    = p => <Icon {...p} d={['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z']} />;
export const IcClock       = p => <Icon {...p} d={['M12 2a10 10 0 100 20A10 10 0 0012 2z','M12 6v6l4 2']} />;
export const IcMapPin      = p => <Icon {...p} d={['M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z','M12 13a3 3 0 100-6 3 3 0 000 6z']} />;
export const IcLogOut      = p => <Icon {...p} d={['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4','M16 17l5-5-5-5','M21 12H9']} />;
export const IcChevronDown = p => <Icon {...p} d={['M6 9l6 6 6-6']} />;
export const IcCheck       = p => <Icon {...p} d={['M20 6L9 17l-5-5']} />;
export const IcX           = p => <Icon {...p} d={['M18 6L6 18','M6 6l12 12']} />;
export const IcArrowRight  = p => <Icon {...p} d={['M5 12h14','M12 5l7 7-7 7']} />;
export const IcTrend       = p => <Icon {...p} d={['M23 6l-9.5 9.5-5-5L1 18']} />;
export const IcLayers      = p => <Icon {...p} d={['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5']} />;
export const IcBriefcase   = p => <Icon {...p} d={['M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z','M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2']} />;
export const IcSettings    = p => <Icon {...p} d={['M12 15a3 3 0 100-6 3 3 0 000 6z','M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z']} />;
export const IcGrid        = p => <Icon {...p} d={['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z']} />;
export const IcFilter      = p => <Icon {...p} d={['M22 3H2l8 9.46V19l4 2v-8.54L22 3z']} />;
export const IcDownload    = p => <Icon {...p} d={['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4','M7 10l5 5 5-5','M12 15V3']} />;
export const IcRefresh     = p => <Icon {...p} d={['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15']} />;
export const IcBuilding    = p => <Icon {...p} d={['M3 21h18','M5 21V7l8-4 8 4v14','M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4']} />;
export const IcActivity    = p => <Icon {...p} d={['M22 12h-4l-3 9L9 3l-3 9H2']} />;
export const IcFolder      = p => <Icon {...p} d={['M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z']} />;
export const IcPieChart    = p => <Icon {...p} d={['M21.21 15.89A10 10 0 118 2.83','M22 12A10 10 0 0012 2v10z']} />;
export const IcSend        = p => <Icon {...p} d={['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z']} />;
export const IcMessage     = p => <Icon {...p} d={['M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z']} />;
export const IcSun         = p => <Icon {...p} d={['M12 17a5 5 0 100-10 5 5 0 000 10z','M12 1v2','M12 21v2','M4.22 4.22l1.42 1.42','M18.36 18.36l1.42 1.42','M1 12h2','M21 12h2','M4.22 19.78l1.42-1.42','M18.36 5.64l1.42-1.42']} />;
export const IcMoon        = p => <Icon {...p} d={['M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z']} />;
export const IcDatabase    = p => <Icon {...p} d={['M12 3a9 3 0 100 6 9 3 0 000-6z','M3 6v12a9 3 0 0018 0V6']} />;
