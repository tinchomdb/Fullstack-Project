namespace Api.Configuration;

public class CacheSettings
{
    public bool EnableCaching { get; set; }
    
    public int CategoriesExpirationMinutes { get; set; }
    
    public int ProductsExpirationMinutes { get; set; }
    
    public int CarouselSlidesExpirationMinutes { get; set; }
    
    public int SingleItemExpirationMinutes { get; set; }
}
