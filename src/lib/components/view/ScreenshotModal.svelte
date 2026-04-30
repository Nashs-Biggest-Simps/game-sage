<script>
	let {
		modalIdx = null,
		modalSrc = null,
		screenshots = [],
		closeModal,
		modalPrev,
		modalNext,
	} = $props()
</script>

{#if modalIdx !== null && modalSrc}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Screenshot viewer"
		tabindex="-1"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<button class="modal-close" onclick={closeModal} aria-label="Close">
			<i class="fa-solid fa-xmark"></i>
		</button>

		{#if modalIdx > 0}
			<button class="modal-nav prev" onclick={(e) => { e.stopPropagation(); modalPrev() }} aria-label="Previous screenshot">
				<i class="fa-solid fa-chevron-left"></i>
			</button>
		{/if}

		<img class="modal-img" src={modalSrc} alt="Screenshot {modalIdx + 1}" />

		{#if modalIdx < screenshots.length - 1}
			<button class="modal-nav next" onclick={(e) => { e.stopPropagation(); modalNext() }} aria-label="Next screenshot">
				<i class="fa-solid fa-chevron-right"></i>
			</button>
		{/if}

		<div class="modal-counter">{modalIdx + 1} / {screenshots.length}</div>
	</div>
{/if}
