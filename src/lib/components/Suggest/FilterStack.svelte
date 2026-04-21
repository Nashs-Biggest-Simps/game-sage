<!-- created by Aaron Meche -->
<script>
    import FilterStackSection from '$lib/components/Suggest/FilterStackSection.svelte'
</script>

<div class="filter-wrapper">
    <div class="filter-heading">Filters</div>
    <FilterStackSection
        label="Display"
        options={['All', 'Never Played']}
    />
    <FilterStackSection
        label="Sort"
        options={['None', 'Most Played', 'Recently Played', 'A → Z', 'Z → A', 'Never Played']}
    />
</div>

<style>
    .filter-wrapper {
        display: flex;
        flex-direction: column;
    }

    .filter-heading {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 1.2rem;
        opacity: 0.85;
    }
</style>
