import Link from "next/link";

export default function InvestmentPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Investment Dashboard</h1>
            <ul className="list-disc list-inside pl-4">
                <li><Link href="/investment/eur">EUR Investment Calculator</Link></li>
            </ul>
        </div>
    );
}