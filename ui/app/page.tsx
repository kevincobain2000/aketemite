import { title, subtitle } from "@/components/primitives";
import { ResultsTable } from "@/components/results_table";

export default function Home() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-lg text-center justify-center">
				<h1 className={title({ color: "yellow" })}>Site&nbsp;</h1>
				<h1 className={title({ color: "violet" })}>Aketemite&nbsp;</h1>
				<br />
				<h1 className="text-default-500">
                    For websites, API with crawling and scraping
				</h1>
                <p className="text-default-200">

                </p>
			</div>

			<div className="mt-8">
                <ResultsTable />
			</div>
		</section>
	);
}
