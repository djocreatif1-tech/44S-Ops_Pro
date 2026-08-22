import React from 'react';
import { Lock, ShieldAlert, Info } from 'lucide-react';
import { UserRole } from '../../types';
import { getRoleMeta } from '../../utils/permissions';

interface RoleRestrictedBannerProps {
  userRole: UserRole;
  moduleName: string;
  allowedActionsText?: string;
  restrictedActionsText?: string;
  onOpenRoleModal?: () => void;
}

export const RoleRestrictedBanner: React.FC<RoleRestrictedBannerProps> = ({
  userRole,
  moduleName,
  allowedActionsText,
  restrictedActionsText,
  onOpenRoleModal
}) => {
  const meta = getRoleMeta(userRole);

  // If role is owner, no need to show restricted banner
  if (userRole === 'owner') return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
          <Lock className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-950">
              Hak Akses Terbatas ({meta.title}):
            </span>
            <span className="text-amber-800">
              Modul <strong className="font-bold">{moduleName}</strong>.
            </span>
          </div>
          <p className="text-[11px] text-amber-800/90 mt-0.5">
            {restrictedActionsText || 'Beberapa tindakan seperti Tambah, Edit, atau Hapus dibatasi sesuai peran Anda.'}
            {allowedActionsText && <span className="text-amber-900 font-medium"> ({allowedActionsText})</span>}
          </p>
        </div>
      </div>

      {onOpenRoleModal && (
        <button
          type="button"
          onClick={onOpenRoleModal}
          className="self-start sm:self-auto text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap"
        >
          Lihat Hak Akses
        </button>
      )}
    </div>
  );
};
