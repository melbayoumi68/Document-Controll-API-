using System.Text;
using DC.DAL.Data;
using DC.BLL.Dtos.Email;
using DC.BLL.Interfaces;
using DC.BLL.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT + Security settings from configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SecuritySettings>(builder.Configuration.GetSection("Security"));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? string.Empty;
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    // Development fallback only — override via env / user-secrets in real deploys
    jwtKey = "DC_DEV_ONLY_CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_32+";
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSection["Issuer"] ?? "DC.Api",
            ValidAudience = jwtSection["Audience"] ?? "DC.Client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Services
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IDepartmentServices, DepartmentService>();
builder.Services.AddScoped<IContractorService, ContractorServices>();
builder.Services.AddScoped<IDocumentType, DocumentTypeServices>();
builder.Services.AddScoped<IDocumentCategory, DocumentCategoryServices>();
builder.Services.AddScoped<IContractAssignment, ContractAssignmentServices>();
builder.Services.AddScoped<IUserService, UserServices>();
builder.Services.AddScoped<DocumentNumberingService>();
builder.Services.AddScoped<AuditHelper>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IDocumentVersionService, DocumentVersionService>();
builder.Services.AddScoped<IConsultantReviewService, ConsultantReviewService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IDocumentCodingOrderService, DocumentCodingOrderService>();

// Email
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEmailTemplateService, EmailTemplateService>();

var app = builder.Build();

// Exception handling
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (UnauthorizedAccessException ex)
    {
        context.Response.StatusCode = 401;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "DC API V1");
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// DB migrate + seed (Development only for seed passwords)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (app.Environment.IsDevelopment())
    {
        var passwords = scope.ServiceProvider.GetRequiredService<PasswordService>();
        await DbSeeder.SeedAsync(db, (user, plain) => passwords.HashPassword(user, plain));
    }
}

app.Run();
