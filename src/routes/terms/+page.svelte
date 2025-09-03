<script lang="ts">
	import { onMount } from 'svelte';

	let activeSection = $state<string>('');
	let sections = $state<Array<{ id: string; title: string }>>([]);

	onMount(() => {
		const headings = document.querySelectorAll('h2[id]');
		sections = Array.from(headings).map((heading) => ({
			id: heading.id,
			title: heading.textContent || ''
		}));

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeSection = entry.target.id;
					}
				});
			},
			{ rootMargin: '-100px 0px -70% 0px' }
		);

		headings.forEach((heading) => observer.observe(heading));

		return () => observer.disconnect();
	});

	function scrollToSection(id: string): void {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<div class="min-h-screen bg-base p-8">
	<div class="max-w-grid mx-auto grid gap-8 lg:grid-cols-[250px_1fr]">
		<!-- サイドバー（デスクトップのみ） -->
		<aside class="hidden lg:block lg:sticky lg:top-8 lg:h-fit">
			<nav class="bg-surface rounded-lg p-6 shadow-sm border-1 border-border">
				<h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-4">目次</h3>
				<ul class="list-none p-0 m-0">
					{#each sections as section (section.id)}
						<li class="mb-2">
							<button
								class={`block w-full text-left px-3 py-2 border-none rounded-base text-sm cursor-pointer transition-all duration-base ease-out ${
									activeSection === section.id
										? 'bg-neutral text-primary font-medium'
										: 'bg-transparent text-muted hover:bg-neutral hover:text-base'
								}`}
								onclick={() => scrollToSection(section.id)}
							>
								{section.title}
							</button>
						</li>
					{/each}
				</ul>
			</nav>
		</aside>

		<!-- メインコンテンツ -->
		<main class="bg-surface rounded-lg p-8 shadow-lg border-1 border-border">
			<header class="border-b-2 border-border pb-4 mb-8">
				<h1 class="text-4xl font-bold text-base m-0">利用規約</h1>
				<p class="mt-2 text-muted text-sm">最終更新日: 2025年1月2日</p>
			</header>

			<div class="leading-relaxed">
				<div class="bg-neutral border-l-4 border-primary p-4 px-6 mb-8 rounded-base text-base">
					<p>
						この利用規約（以下、「本規約」といいます。）は、当社が提供する給与・資産管理サービス（以下、「本サービス」といいます。）の利用条件を定めるものです。
						ご利用の前に必ずお読みください。
					</p>
				</div>

				<section class="mb-10">
					<h2 id="agreement" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第1条（規約への同意）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">
							本サービスをご利用いただくには、本規約に同意していただく必要があります。
						</li>
						<li class="mb-3">
							本サービスを実際にご利用いただいた場合、本規約に同意したものとみなします。
						</li>
						<li class="mb-3">未成年者の方は、親権者の同意を得た上でご利用ください。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="service" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第2条（サービスの内容）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">
							本サービスは、以下の機能を提供します：
							<ul class="list-disc pl-6 mt-2 mx-6 text-base">
								<li class="mb-1">給与明細の管理・分析</li>
								<li class="mb-1">株式ポートフォリオの管理</li>
								<li class="mb-1">資産の時価評価</li>
								<li class="mb-1">財務レポートの生成</li>
							</ul>
						</li>
						<li class="mb-3">本サービスの内容は、予告なく変更される場合があります。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="account" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第3条（アカウント管理）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">利用者は、アカウント情報を適切に管理する責任を負います。</li>
						<li class="mb-3">
							パスワードは定期的に変更し、第三者に知られないよう管理してください。
						</li>
						<li class="mb-3">アカウントの不正利用が判明した場合、直ちに当社に連絡してください。</li>
						<li class="mb-3">
							アカウント情報の管理不備による損害について、当社は責任を負いません。
						</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="privacy" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第4条（個人情報の取扱い）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">当社は、利用者の個人情報を適切に保護します。</li>
						<li class="mb-3">
							収集した情報は、以下の目的でのみ使用します：
							<ul class="list-disc pl-6 mt-2 mx-6 text-base">
								<li class="mb-1">サービスの提供・改善</li>
								<li class="mb-1">利用者サポート</li>
								<li class="mb-1">重要なお知らせの送信</li>
							</ul>
						</li>
						<li class="mb-3">法令に基づく場合を除き、第三者への提供は行いません。</li>
						<li class="mb-3">詳細は別途定める「プライバシーポリシー」をご確認ください。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="security" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第5条（セキュリティ）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">当社は、業界標準のセキュリティ対策を実施しています。</li>
						<li class="mb-3">データは暗号化して保存・送信されます。</li>
						<li class="mb-3">定期的なセキュリティ監査を実施しています。</li>
						<li class="mb-3">ただし、完全なセキュリティを保証するものではありません。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="prohibited" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第6条（禁止事項）
					</h2>
					<p class="text-base mb-3">以下の行為を禁止します：</p>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">法令または公序良俗に違反する行為</li>
						<li class="mb-3">当社または第三者の権利を侵害する行為</li>
						<li class="mb-3">サービスの運営を妨害する行為</li>
						<li class="mb-3">不正アクセスやハッキング行為</li>
						<li class="mb-3">虚偽の情報を登録する行為</li>
						<li class="mb-3">複数のアカウントを作成する行為</li>
						<li class="mb-3">営利目的での利用（事前承認なく）</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="intellectual" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第7条（知的財産権）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">本サービスに関する知的財産権は当社に帰属します。</li>
						<li class="mb-3">利用者がアップロードしたデータの権利は利用者に帰属します。</li>
						<li class="mb-3">
							当社は、サービス改善のため匿名化したデータを利用する場合があります。
						</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="disclaimer" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第8条（免責事項）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">本サービスは「現状有姿」で提供されます。</li>
						<li class="mb-3">サービスの中断・停止による損害について責任を負いません。</li>
						<li class="mb-3">利用者間のトラブルについて、当社は関与しません。</li>
						<li class="mb-3">
							本サービスを通じて行った投資判断による損失について、当社は責任を負いません。
						</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="termination" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第9条（利用停止・アカウント削除）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">規約違反があった場合、事前通知なく利用を停止する場合があります。</li>
						<li class="mb-3">利用者は、いつでもアカウントを削除できます。</li>
						<li class="mb-3">アカウント削除後、データの復旧はできません。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="changes" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第10条（規約の変更）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">本規約は、必要に応じて変更される場合があります。</li>
						<li class="mb-3">重要な変更がある場合は、事前にお知らせします。</li>
						<li class="mb-3">変更後も継続して利用した場合、変更に同意したものとみなします。</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="governing" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第11条（準拠法・管轄）
					</h2>
					<ol class="list-decimal pl-6 my-4 text-base">
						<li class="mb-3">本規約は、日本法に準拠します。</li>
						<li class="mb-3">
							本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
						</li>
					</ol>
				</section>

				<section class="mb-10">
					<h2 id="contact" class="text-xl font-semibold text-base mt-8 mb-4 pt-4">
						第12条（お問い合わせ）
					</h2>
					<p class="text-base mb-4">本規約に関するお問い合わせは、以下までご連絡ください：</p>
					<div class="bg-neutral p-4 rounded-base mt-4 border-1 border-border">
						<p class="my-2 text-base">メール: support@example.com</p>
						<p class="my-2 text-base">
							お問い合わせフォーム:
							<a
								href="/contact"
								class="text-primary no-underline transition-opacity duration-fast ease-out hover:opacity-80 hover:underline"
							>
								こちら
							</a>
						</p>
					</div>
				</section>
			</div>

			<footer class="mt-12 pt-8 border-t-1 border-border text-center">
				<p class="text-sm text-muted">© 2025 給与・資産管理サービス. All rights reserved.</p>
			</footer>
		</main>
	</div>
</div>
