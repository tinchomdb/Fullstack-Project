namespace Application.DTOs;

public sealed record CartTotalValidationResult
{
    public bool IsValid { get; init; }
    public string? ErrorMessage { get; init; }

    public static CartTotalValidationResult Success() => new() { IsValid = true };

    public static CartTotalValidationResult Failure(string errorMessage)
        => new() { IsValid = false, ErrorMessage = errorMessage };
}
