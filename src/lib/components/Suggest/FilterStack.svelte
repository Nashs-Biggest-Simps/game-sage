<!-- created by Aaron Meche -->
<script>
    import FilterStackSection from "$lib/components/Suggest/FilterStackSection.svelte";

</script>

<!--  -->

<div class="filter-wrapper">
    <FilterStackSection
        label="Display"
        options={["All", "Owned", "Not Owned"]}
        select="one"
    />
    <FilterStackSection
        label="Genre"
        options={["All", "Custom"]}
        select="one"
    />
    <FilterStackSection
        label="Platform"
        options={["All", "Windows", "Mac", "PlayStation", "Xbox"]}
        select="one"
    />
    <FilterStackSection
        label="Max Playtime"
        options={["None", "Custom"]}
        select="one"
    />
    <FilterStackSection
        label="Max Price"
        options={["None", "Custom"]}
        select="one"
    />
    <FilterStackSection
        label="Sort"
        options={["Relevance", "Price: Low to High", "Price: High to Low", "Rating: High to Low", "Rating, Low to High"]}
        select="one"
    />
</div>

<!--  -->

<style>
    .filter-wrapper{
        position: sticky;
        top: 2.4rem;
        padding-right: 3.6rem;
        white-space: nowrap;
    }
</style>