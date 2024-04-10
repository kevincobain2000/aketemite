import { title, subtitle } from "@/components/primitives";
import { ResultsTable } from "@/components/results_table";

export default function Home() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-lg text-center justify-center">
				<h1 className="text-3xl font-bold">Aketemite</h1>
				<br />
				<h1 className="text-default-500">
                    For websites, with crawling and scraping
				</h1>
			</div>

			<div className="mt-8">
                <ResultsTable />
			</div>
		</section>
	);
}
