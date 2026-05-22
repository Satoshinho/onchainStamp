import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";
import { keccak256, toHex, toBytes } from "viem";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "stampDocument", type: "function", stateMutability: "nonpayable", inputs: [{ name: "docHash", type: "bytes32" }, { name: "description", type: "string" }], outputs: [] },
  { name: "verifyDocument", type: "function", stateMutability: "view", inputs: [{ name: "docHash", type: "bytes32" }],
    outputs: [{ name: "exists", type: "bool" }, { name: "stamp", type: "tuple", components: [{ name: "docHash", type: "bytes32" }, { name: "description", type: "string" }, { name: "certifier", type: "address" }, { name: "timestamp", type: "uint256" }] }] },
  { name: "getRecentStamps", type: "function", stateMutability: "view", inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [{ name: "docHash", type: "bytes32" }, { name: "description", type: "string" }, { name: "certifier", type: "address" }, { name: "timestamp", type: "uint256" }] }] },
  { name: "totalStamps", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

function timeAgo(ts: bigint) { const s=Math.floor(Date.now()/1000-Number(ts)); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; return`${Math.floor(s/3600)}h ago`; }

export default function App() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<"stamp"|"verify">("stamp");
  const [text, setText] = useState(""); const [desc, setDesc] = useState(""); const [done, setDone] = useState(false);
  const [verifyText, setVerifyText] = useState("");
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: stamps, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getRecentStamps", args: [BigInt(15)], query: { refetchInterval: 15000 } });
  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalStamps" });

  const docHash = text ? keccak256(toHex(toBytes(text))) : null;
  const { data: verifyResult } = useReadContract({ address: ADDR, abi: ABI, functionName: "verifyDocument", args: [keccak256(toHex(toBytes(verifyText))) as `0x${string}`], query: { enabled: verifyText.length > 0 } });

  if (isSuccess && !done) { setDone(true); refetch(); setTimeout(() => setDone(false), 3000); }
  const list = (stamps as any[] | undefined)?.slice().reverse() ?? [];
  const isLoading = isPending || isConfirming;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#eab308]/6 blur-[120px]" />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📜</span>
          <span className="font-bold text-white text-lg">onchain<span className="text-[#eab308]">Stamp</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-4xl font-black text-white mb-3">Certify On<span className="text-[#eab308]">-Chain</span></h1>
          <p className="text-slate-400 text-sm">Timestamp any document or text on Arc. Prove it existed — forever.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ label: "Total Stamps", value: total?.toString() ?? "—", icon: "📜" }, { label: "Network", value: "Arc Testnet", icon: "⛓️" }].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div><div className="text-white font-bold text-lg">{s.value}</div><div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          {(["stamp","verify"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab===t ? "bg-[#eab308] text-black" : "bg-slate-800/60 text-slate-400 hover:text-white"}`}>
              {t === "stamp" ? "📜 Stamp Document" : "🔍 Verify"}
            </button>
          ))}
        </div>
        {tab === "stamp" && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Stamp a Document 📜</h2>
            <div className="space-y-3 mb-4">
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your document content or any text to certify..." rows={4} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#eab308]/60 transition-all resize-none" />
              {docHash && <p className="text-slate-500 text-xs font-mono break-all">Hash: {docHash}</p>}
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#eab308]/60 transition-all" />
            </div>
            {!isConnected ? <p className="text-slate-500 text-sm text-center py-2">Connect wallet to stamp</p>
            : done ? <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#eab308]/15 border border-[#eab308]/40 text-[#eab308] font-semibold">✅ Document stamped on-chain!</div>
            : <button onClick={() => docHash && writeContract({ address: ADDR, abi: ABI, functionName: "stampDocument", args: [docHash as `0x${string}`, desc] })} disabled={isLoading || !text}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#eab308] text-black hover:bg-[#facc15] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isLoading ? <><svg className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />{isPending ? "Confirm…" : "Stamping…"}</> : "📜 Stamp On-Chain"}
              </button>}
          </div>
        )}
        {tab === "verify" && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Verify a Document 🔍</h2>
            <textarea value={verifyText} onChange={e => setVerifyText(e.target.value)} placeholder="Paste the document text to verify..." rows={4} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#eab308]/60 transition-all resize-none mb-4" />
            {verifyResult && (
              <div className={`rounded-xl p-4 ${(verifyResult as any)[0] ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                {(verifyResult as any)[0] ? (
                  <><p className="text-green-400 font-bold">✅ Document verified on-chain!</p>
                  <p className="text-slate-400 text-xs mt-1">Stamped by {(verifyResult as any)[1].certifier.slice(0,6)}…{(verifyResult as any)[1].certifier.slice(-4)}</p></>
                ) : <p className="text-red-400 font-bold">❌ Not found on-chain</p>}
              </div>
            )}
          </div>
        )}
        <h2 className="text-lg font-bold text-white mb-4">Recent Stamps</h2>
        <div className="space-y-2">
          {list.length === 0 && <div className="text-center py-8 text-slate-500">No stamps yet</div>}
          {list.map((s: any, i: number) => (
            <div key={i} className="bg-slate-900/70 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">📜</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm truncate">{s.description || "No description"}</p>
                <p className="text-slate-600 text-xs font-mono">{(s.docHash as string).slice(0,12)}… · {timeAgo(s.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>Built on <a href="https://arc.network" className="hover:text-slate-400">Arc Network</a> · Chain ID {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
