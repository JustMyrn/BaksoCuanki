const fs = require('fs');
const p = '../client/src/components/admin/AdminReviewPostEventPage.jsx';
const c = `
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#072D6C]">
        <div className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-[9px]">
            <img src={\`\${IC}/icon-commute.svg\`} alt="" className="h-[58px] w-[54px]" style={{filter:'brightness(0) saturate(100%) invert(12%) sepia(63%) saturate(2915%) hue-rotate(214deg) brightness(92%) contrast(101%)'}}/>
            <span className="text-[50px] font-black text-[#072D6C]">Progres Perjalanan</span>
          </div>
          <div className="flex items-center gap-7">
            <img src={\`\${IC}/icon-bell.svg\`} alt="" className="h-8 w-7"/>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[15px] font-black text-[#0B53C0]">Profile</span>
                <span className="text-lg font-bold text-black">{n}</span>
              </div>
              <img src={\`\${IC}/icon-profile.svg\`} alt="" className="h-9 w-9"/>
            </div>
          </div>
        </div>

        <div className="mx-8 mt-[10px] flex items-center gap-[9px]">
          <button onClick={() => onNavigate?.('review-pre', emp)} className="min-w-[138px] rounded-[10px] bg-white px-[18px] py-[7px] text-xl font-semibold text-black hover:bg-gray-100 transition">Pre-Event</button>
          <button onClick={() => onNavigate?.('review-event', emp)} className="min-w-[138px] rounded-[10px] bg-white px-10 py-[7px] text-xl font-semibold text-black hover:bg-gray-100 transition">Event</button>
          <button className="min-w-[138px] rounded-[10px] bg-[#ACD9FF] px-[13px] py-[7px] text-xl font-semibold text-black">Post-Event</button>
        </div>

        <h2 className="mx-8 mt-4 text-4xl font-extrabold text-white">POST-EVENT</h2>
        <p className="mx-8 mt-2">
          <span className="text-2xl font-semibold text-white">DETAIL REVIEW: </span>
          <span className="text-lg font-normal text-white">{emp.fullName || 'Nama Lengkap'}</span>
        </p>

        <div className="mx-8 mt-4 flex flex-col gap-[13px]">
          <div className="flex h-14 items-center rounded-[10px] bg-white px-5">
            <span className="text-base font-normal text-black">Transportasi yang dipergunakan :</span>
            <span className="ml-4 text-base font-semibold text-black">{transportasi}</span>
          </div>
          <div className="flex h-14 items-center rounded-[10px] bg-white px-5">
            <span className="text-base font-normal text-black">Gunakan Kapal Laut :</span>
            <span className="ml-4 text-base font-semibold text-black">{kapalLaut}</span>
          </div>
          <div className="flex h-14 items-center rounded-[10px] bg-white px-5">
            <span className="text-base font-normal text-black">Kebutuhan Tambahan :</span>
            <span className="ml-4 text-base font-semibold text-black">{kebutuhan}</span>
          </div>
        </div>

`;
fs.appendFileSync(p, c);
console.log('P2 header+info OK');