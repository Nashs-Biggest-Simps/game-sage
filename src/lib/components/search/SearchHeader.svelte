<script>
	let { ownedCount = 0 } = $props()
</script>

<div class="search-header">
	<div>
		<div class="page-title">Search</div>
		<div class="page-subtitle">Find games in your library or discover titles across the Steam Store.</div>
	</div>
	<div class="search-stats">
		<span><i class="fa-solid fa-gamepad"></i>{ownedCount.toLocaleString()} owned</span>
		<span><i class="fa-brands fa-steam"></i>Store lookup</span>
	</div>
</div>
